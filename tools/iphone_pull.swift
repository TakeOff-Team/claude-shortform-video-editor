// iphone_pull: list or download the newest videos from a USB-connected iPhone via Apple's
// ImageCaptureCore (same engine as the Image Capture app). No installs needed.
//
//   iphone_pull list [--n 10]              newest videos, newest first (JSON lines)
//   iphone_pull pull --n 1 --out <dir>     download the newest N videos into <dir>
//   --any                                  include saved/downloaded videos (default: camera recordings only)
//   iphone_pull pull --names IMG_1.MOV,IMG_2.MOV --out <dir>
//
// Exit codes: 2 = no iPhone found, 3 = phone locked / not trusted, 4 = download failed.
import Foundation
import ImageCaptureCore

func arg(_ k: String) -> String? {
    let a = CommandLine.arguments
    guard let i = a.firstIndex(of: "--" + k), i + 1 < a.count else { return nil }
    return a[i + 1]
}
func log(_ s: String) { FileHandle.standardError.write((s + "\n").data(using: .utf8)!) }

let mode = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "list"
let wantN = Int(arg("n") ?? (mode == "list" ? "10" : "1")) ?? 1
let wantNames = arg("names").map { Set($0.split(separator: ",").map(String.init)) }
let anyVideo = CommandLine.arguments.contains("--any") // include saved/downloaded videos
let outDir = URL(fileURLWithPath: arg("out") ?? FileManager.default.currentDirectoryPath)

let videoExt: Set<String> = ["mov", "mp4", "m4v"]
let iso = ISO8601DateFormatter()

final class Puller: NSObject, ICDeviceBrowserDelegate, ICCameraDeviceDelegate {
    let browser = ICDeviceBrowser()
    var camera: ICCameraDevice?
    var lockedWarned = false
    var attempts = 0

    func start() {
        browser.delegate = self
        browser.browsedDeviceTypeMask = ICDeviceTypeMask(rawValue:
            ICDeviceTypeMask.camera.rawValue | ICDeviceLocationTypeMask.local.rawValue)!
        browser.start()
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
            if self.camera == nil { log("NO_IPHONE: plug the phone in with a cable, unlock it and tap Trust."); exit(2) }
        }
    }

    // MARK: browser
    func deviceBrowser(_ browser: ICDeviceBrowser, didAdd device: ICDevice, moreComing: Bool) {
        guard camera == nil, let cam = device as? ICCameraDevice else { return }
        log("found: \(cam.name ?? "camera")")
        camera = cam
        cam.delegate = self
        cam.requestOpenSession()
    }
    func deviceBrowser(_ browser: ICDeviceBrowser, didRemove device: ICDevice, moreGoing: Bool) {}

    // MARK: device
    func device(_ device: ICDevice, didOpenSessionWithError error: Error?) {
        if let e = error {
            // locked / not trusted yet: keep retrying for ~2 min so the user can unlock without re-running
            attempts += 1
            if attempts == 1 { log("LOCKED: unlock your iPhone and keep it on the home screen (tap Trust if asked). Waiting...") }
            if attempts > 40 { log("LOCKED: gave up after 2 min (\(e.localizedDescription))"); exit(3) }
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) { (device as? ICCameraDevice)?.requestOpenSession() }
            return
        }
        log("session open")
        // a locked phone opens the session but shows no files; give the user time to unlock
        DispatchQueue.main.asyncAfter(deadline: .now() + 60) {
            log("LOCKED: still no photo library after 60s. Unlock the phone and tap Trust, then run again."); exit(3)
        }
    }
    func didRemove(_ device: ICDevice) { log("phone disconnected"); exit(4) }
    func device(_ device: ICDevice, didCloseSessionWithError error: Error?) {}
    func device(_ device: ICDevice, didEncounterError error: Error?) {}

    // MARK: camera
    func cameraDeviceDidEnableAccessRestriction(_ device: ICDevice) {
        if !lockedWarned { log("LOCKED: unlock your iPhone (and tap Trust if asked). Waiting..."); lockedWarned = true }
    }
    func cameraDeviceDidRemoveAccessRestriction(_ device: ICDevice) { log("unlocked, reading library...") }
    func deviceDidBecomeReady(withCompleteContentCatalog device: ICCameraDevice) { handle(device) }
    func cameraDevice(_ camera: ICCameraDevice, didAdd items: [ICCameraItem]) {}
    func cameraDevice(_ camera: ICCameraDevice, didRemove items: [ICCameraItem]) {}
    func cameraDevice(_ camera: ICCameraDevice, didRenameItems items: [ICCameraItem]) {}
    func cameraDevice(_ camera: ICCameraDevice, didReceiveThumbnail thumbnail: CGImage?, for item: ICCameraItem, error: Error?) {}
    func cameraDevice(_ camera: ICCameraDevice, didReceiveMetadata metadata: [AnyHashable: Any]?, for item: ICCameraItem, error: Error?) {}
    func cameraDeviceDidChangeCapability(_ camera: ICCameraDevice) {}
    func cameraDevice(_ camera: ICCameraDevice, didReceivePTPEvent eventData: Data) {}

    func handle(_ cam: ICCameraDevice) {
        let all = (cam.mediaFiles ?? []).compactMap { $0 as? ICCameraFile }
        // Live Photo motion clips are .MOV files sharing a base name with a photo: skip them
        let stills = Set(all.filter { !videoExt.contains(($0.name ?? "").split(separator: ".").last.map { $0.lowercased() } ?? "") }
            .map { base($0.name) })
        var vids = all.filter {
            let ext = ($0.name ?? "").split(separator: ".").last.map { $0.lowercased() } ?? ""
            // camera recordings are IMG_####; saved/downloaded videos get random names (LDDP0115.MOV): skip them
            let camera = anyVideo || ($0.name ?? "").hasPrefix("IMG_")
            // skip accidental pocket clips under 8s
            return videoExt.contains(ext) && !stills.contains(base($0.name)) && camera && $0.duration >= 8
        }
        vids.sort { ($0.creationDate ?? .distantPast) > ($1.creationDate ?? .distantPast) }
        log("library: \(all.count) items, \(vids.count) videos")

        let picked: [ICCameraFile] = wantNames.map { names in vids.filter { names.contains($0.name ?? "") } } ?? Array(vids.prefix(wantN))
        if mode == "list" {
            for f in picked { print(json(f)) }
            exit(0)
        }
        try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
        download(picked, 0)
    }

    func download(_ files: [ICCameraFile], _ i: Int) {
        guard i < files.count else { exit(0) }
        let f = files[i]
        log("downloading \(f.name ?? "?") (\(f.fileSize / 1_000_000) MB)...")
        let opts: [ICDownloadOption: Any] = [.downloadsDirectoryURL: outDir, .overwrite: true]
        f.requestDownload(options: opts) { filename, error in
            if let e = error { log("download failed: \(e.localizedDescription)"); exit(4) }
            var o = self.jsonDict(f)
            o["path"] = outDir.appendingPathComponent(filename ?? f.name ?? "").path
            print(self.str(o))
            fflush(stdout)
            self.download(files, i + 1)
        }
    }

    func base(_ n: String?) -> String { (n ?? "").split(separator: ".").first.map(String.init) ?? "" }
    func jsonDict(_ f: ICCameraFile) -> [String: Any] {
        ["name": f.name ?? "", "created": f.creationDate.map { iso.string(from: $0) } ?? "",
         "mb": f.fileSize / 1_000_000, "duration": f.duration]
    }
    func json(_ f: ICCameraFile) -> String { str(jsonDict(f)) }
    func str(_ o: [String: Any]) -> String {
        String(data: try! JSONSerialization.data(withJSONObject: o, options: [.sortedKeys]), encoding: .utf8)!
    }
}

let p = Puller()
p.start()
RunLoop.main.run()

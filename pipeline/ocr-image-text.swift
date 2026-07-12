#!/usr/bin/env swift

import AppKit
import Foundation
import Vision

func fail(_ message: String) -> Never {
    FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
    exit(2)
}

guard CommandLine.arguments.count == 2 else {
    fail("usage: swift pipeline/ocr-image-text.swift <image>")
}

let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard
    let image = NSImage(contentsOf: imageURL),
    let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
    fail("cannot load OCR image: \(imageURL.path)")
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.usesLanguageCorrection = true

do {
    try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
} catch {
    fail("Vision OCR failed: \(error.localizedDescription)")
}

let lines = (request.results ?? [])
    .sorted {
        let verticalDelta = $0.boundingBox.midY - $1.boundingBox.midY
        if abs(verticalDelta) > 0.01 { return verticalDelta > 0 }
        return $0.boundingBox.minX < $1.boundingBox.minX
    }
    .compactMap { $0.topCandidates(1).first?.string }

print(lines.joined(separator: "\n"))

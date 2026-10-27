"""Local ONNX audition only. No Azure, credentials, hosted API, or remote code execution.

Token ordering/basic text cleaning follow langtech-bsc/Matcha-TTS v2-graphemes,
whose source is separately inspected/cached. Source expressions are parsed as
literal strings; no upstream Python code is executed/imported.
"""
import argparse
import ast
import hashlib
import importlib.metadata
import json
import pathlib
import re
import sys
import time
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIRECTORIES = {"original": "output/audio/matxa-v2-balear-pilot", "slow": "output/audio/matxa-v2-balear-slow-pilot"}


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def symbols_from_source(path):
    wanted = {"_pad", "_punctuation", "_letters", "_letters_ipa", "_letters_accented"}
    strings = {}
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) and node.targets[0].id in wanted:
            value = ast.literal_eval(node.value)
            if not isinstance(value, str):
                raise ValueError("Upstream symbol field must be a literal string")
            strings[node.targets[0].id] = value
    if set(strings) != wanted:
        raise ValueError("Incomplete upstream symbol inventory")
    return [strings["_pad"]] + list(strings["_punctuation"]) + list(strings["_letters"]) + list(strings["_letters_ipa"]) + list(strings["_letters_accented"])


def token_ids(text, symbols):
    # basic_cleaners: lowercase + collapse whitespace; no IPA or transliteration.
    cleaned = re.sub(r"\s+", " ", text.lower())
    lookup = {symbol: index for index, symbol in enumerate(symbols)}
    try:
        ids = [lookup[c] for c in cleaned]
    except KeyError as exc:
        raise ValueError("Grapheme outside model vocabulary") from exc
    # Matcha's intersperse(sequence, 0) adds blank at both edges and between IDs.
    interspersed = [0] * (len(ids) * 2 + 1)
    interspersed[1::2] = ids
    return cleaned, interspersed


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".part")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description="Generate only the frozen Matxa v2 audition locally")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--limit", type=int, choices=range(1, 19), default=18)
    parser.add_argument("--slow", action="store_true", help="Separate 1.25-duration audition; preserve originals")
    args = parser.parse_args()
    DIRECTORY = ROOT / DIRECTORIES["slow" if args.slow else "original"]
    plan = read(DIRECTORY / "plan.json")
    expected_id = "ca-mallorcan-palma-matxa-v2-slow-pilot-v1" if args.slow else "ca-mallorcan-palma-matxa-v2-pilot-v1"
    if plan["id"] != expected_id or plan["settings"]["lengthScale"] != (1.25 if args.slow else 1.0):
        raise ValueError("Unexpected audition ID or duration scale")
    if not args.execute:
        print(json.dumps({"inference": False, "words": args.limit, "voices": plan["voices"], "model": plan["model"]["repository"]}))
        return
    if len(plan["entries"]) != 18 or plan["voices"] != [{"name": "Olga", "speakerId": 0}, {"name": "Quim", "speakerId": 1}]:
        raise ValueError("Audition identity mismatch")
    if plan["source"] != "audio/pronunciation/recordings/ca-mallorcan-palma-pilot-v1.json" or plan["model"]["localPath"] != "tmp/matxa-model/model.onnx":
        raise ValueError("Unexpected audition source/model path")
    source = read(ROOT / plan["source"])
    if [(e["id"], e["text"], e["azureComparisonIpa"]) for e in plan["entries"]] != [(e["id"], e["text"], e["ipa"]) for e in source["entries"]] or any(e["inputText"] != e["text"] for e in plan["entries"]):
        raise ValueError("Audition words differ from the frozen Azure comparison")
    model = ROOT / plan["model"]["localPath"]
    if hashlib.sha256(model.read_bytes()).hexdigest() != plan["model"]["sha256"]:
        raise ValueError("Model SHA-256 mismatch")
    if hashlib.sha256((ROOT / plan["source"]).read_bytes()).hexdigest() != plan["sourceSha256"]:
        raise ValueError("Frozen Azure word-list source changed")
    import numpy as np
    import onnxruntime as ort
    options = ort.SessionOptions()
    options.intra_op_num_threads = plan["settings"]["threads"]
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
    input_description = [{"name": i.name, "type": i.type, "shape": i.shape} for i in session.get_inputs()]
    print(json.dumps({"inputs": input_description, "outputs": [o.name for o in session.get_outputs()]}), flush=True)
    symbols_path = ROOT / "tmp/matxa-model/symbols.py"
    if hashlib.sha256(symbols_path.read_bytes()).hexdigest() != plan["model"]["symbolsSha256"]:
        raise ValueError("Tokenizer source SHA-256 mismatch")
    symbols = symbols_from_source(symbols_path)
    assert {i.name for i in session.get_inputs()} == {"x", "x_lengths", "scales", "spks"}
    assert {o.name for o in session.get_outputs()} == {"mel_lengths", "hfwaveform"}, "Expected the pinned end-to-end Wavenext graph"
    fingerprint = hashlib.sha256(json.dumps(plan, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    identity_file = DIRECTORY / "identity.json"
    if identity_file.exists() and read(identity_file)["fingerprint"] != fingerprint:
        raise ValueError("Settings changed: create a new audition ID")
    write_json(identity_file, {"fingerprint": fingerprint, "plan": plan, "runtime": {"python": sys.version.split()[0], "onnxruntime": ort.__version__, "numpy": np.__version__}})
    result_file = DIRECTORY / "results.json"
    result = read(result_file) if result_file.exists() else {"schemaVersion": 1, "fingerprint": fingerprint, "files": [], "listeningReview": "pending", "publicAudio": False}
    assert result["fingerprint"] == fingerprint
    previous = {(f["voice"], f["id"]): f for f in result["files"]}
    began = time.monotonic()
    status = {"phase": "running", "completed": len(previous), "total": args.limit * 2, "model": plan["model"]["repository"]}
    write_json(DIRECTORY / "status.json", status)
    for voice in plan["voices"]:
        for entry in plan["entries"][:args.limit]:
            target = DIRECTORY / voice["name"].lower() / (entry["text"] + ".wav")
            target.resolve().relative_to(DIRECTORY.resolve())
            target.parent.mkdir(exist_ok=True)
            old = previous.get((voice["name"], entry["id"]))
            if old and target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == old["sha256"]:
                continue
            cleaned, ids = token_ids(entry["inputText"], symbols)
            inputs = {"x": np.asarray([ids], dtype=np.int64), "x_lengths": np.asarray([len(ids)], dtype=np.int64), "scales": np.asarray([plan["settings"]["temperature"], plan["settings"]["lengthScale"]], dtype=np.float32), "spks": np.asarray([voice["speakerId"]], dtype=np.int64)}
            started = time.monotonic()
            outputs = dict(zip([o.name for o in session.get_outputs()], session.run(None, inputs)))
            frame_length = int(outputs["mel_lengths"][0])
            full_waveform = np.asarray(outputs["hfwaveform"][0]).reshape(-1)
            if len(full_waveform) < frame_length * 256:
                raise ValueError("Waveform shorter than its mel-frame length")
            samples = full_waveform[:frame_length * 256]
            if not np.isfinite(samples).all() or not 0.12 < len(samples) / 22050 < 15:
                raise ValueError("Invalid/suspicious generated waveform")
            peak = float(np.max(np.abs(samples)))
            clipped = int(np.count_nonzero(np.abs(samples) >= 1.0))
            # Avoid silent clipping. Scale only if the model exceeds PCM range;
            # preserve all timing and pronunciation, recording the exact gain.
            gain = 0.98 / peak if peak >= 1.0 else 1.0
            pcm = np.round(samples * gain * 32767).astype("<i2")
            with wave.open(str(target), "wb") as output:
                output.setparams((1, 2, 22050, len(pcm), "NONE", "not compressed"))
                output.writeframes(pcm.tobytes())
            item = {"id": entry["id"], "text": entry["text"], "inputText": cleaned, "voice": voice["name"], "speakerId": voice["speakerId"], "localPath": target.relative_to(ROOT).as_posix(), "duration": len(samples) / 22050, "sampleRate": 22050, "channels": 1, "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest(), "modelPeak": peak, "modelOutOfRangeSamples": clipped, "pcmGain": gain, "inferenceSeconds": round(time.monotonic() - started, 3)}
            previous[(voice["name"], entry["id"])] = item
            result["files"] = list(previous.values())
            write_json(result_file, result)
            status.update(completed=len(previous), voice=voice["name"], word=entry["text"])
            write_json(DIRECTORY / "status.json", status)
            print(json.dumps({"voice": voice["name"], "word": entry["text"], "seconds": item["inferenceSeconds"], "audioSeconds": item["duration"]}, ensure_ascii=False), flush=True)
    status.update(phase="completed" if len(previous) == 36 else "partial", completed=len(previous), total=36, elapsedSeconds=round(time.monotonic() - began, 2))
    write_json(DIRECTORY / "status.json", status)


if __name__ == "__main__":
    main()

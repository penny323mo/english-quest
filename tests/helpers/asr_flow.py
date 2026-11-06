"""Run scripts/check_audio_asr.py main() on scripted recogniser output (for tests).

Reads a JSON spec on stdin:
  {"only": [rel, ...], "slow": false,
   "heard": {rel: {"whisper": str, "parakeet": str | null, "fresh": [str, float]}},
   "parakeet": true | false,      # is Parakeet available at all
   "known": {rel: reason}}        # tests/fixtures/asr-known.json for this run
Prints {"exit": int, "json": <the --json file or null>, "stdout": str}.
"""
import contextlib
import io
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import check_audio_asr as ca  # noqa: E402

spec = json.load(sys.stdin)
heard = spec["heard"]
tmp = Path(tempfile.mkdtemp())
known = tmp / "known.json"
known.write_text(json.dumps(spec.get("known", {})), encoding="utf-8")
ca.KNOWN = known
out_json = tmp / "result.json"


def fake_hearers(args, folder, jobs):
    def pick(job, key):
        return heard[job["rel"]][key]

    return {
        "hear_sentence": lambda job: pick(job, "whisper"),
        "hear_word": lambda job: pick(job, "whisper"),
        "hear_parakeet": (lambda job: pick(job, "parakeet")) if spec.get("parakeet", True) else None,
        "fresh": lambda r: tuple(heard[r["rel"]]["fresh"]),
    }


ca.load_hearers = fake_hearers
sys.argv = ["check_audio_asr.py", "--models", str(tmp), "--voice", "unused.onnx", "--json", str(out_json), "--only", *spec["only"]]
if spec.get("slow"):
    sys.argv.append("--slow")
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    code = ca.main()
print(json.dumps({
    "exit": code,
    "json": json.loads(out_json.read_text(encoding="utf-8")) if out_json.exists() else None,
    "stdout": buf.getvalue(),
}))

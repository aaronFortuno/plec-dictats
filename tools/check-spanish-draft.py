"""Check the editorial Spanish draft against a pinned RLA-ES dictionary."""

import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from spylls.hunspell import Dictionary


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "catalogs/es"
DICTIONARY_HASHES = {
    ".dic": "6975dddec3d5d2c676069537bc67b4b5f786c65c5d4cf6703a82acf779ac9ec1",
    ".aff": "e73a9bf8e1383f4986a5dc9e2fbed49371c0c61f511c626d15586bd433c1cad9",
}
FOCUSES = {
    "tilde": r"[áéíóú]", "sin-tilde": r"^[^áéíóú]+$", "h": r"(?:^|[^c])h",
    "gj": r"j|g[eéií]", "bv": r"[bv]", "rr": r"^r|rr|[lns]r|^subr|[aeiouáéíóúü]r[aeiouáéíóúü]",
    "cquz": r"c(?!h)|z|qu", "ggu": r"g[aáoóuúü]", "lly": r"ll|y", "enye-ch": r"ñ|ch", "x": r"x",
}


def read_table(path):
    with path.open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source, delimiter="\t"))


def sound_key(ipa):
    unstressed, stressed = ipa.replace(".", "").split("ˈ")
    nucleus = re.search("[aeiou]", stressed)
    return unstressed + stressed[:nucleus.start()] + "ˈ" + stressed[nucleus.start():]


def fail(message):
    raise SystemExit(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dictionary", type=Path, help="path to es_ES, without an extension")
    parser.add_argument("--json", action="store_true", help="emit proof for the edition builder")
    args = parser.parse_args()
    for extension, expected in DICTIONARY_HASHES.items():
        file = args.dictionary.with_suffix(extension)
        if hashlib.sha256(file.read_bytes()).hexdigest() != expected:
            fail(f"Diccionari incompatible: {file.name}")
    dictionary = Dictionary.from_files(str(args.dictionary))
    draft = read_table(BASE / "review/ampliacion-01.tsv")
    basic = read_table(BASE / "review/vocabulario-basico-afi.tsv")
    published = json.loads((BASE / "editions/seed-1-basic.json").read_text(encoding="utf-8"))["catalog"]
    messages = json.loads((ROOT / "locales/es/messages.json").read_text(encoding="utf-8"))
    labels = {category["id"]: messages.get(category["label"], category["label"])
              for category in published["categories"]}
    if [row["palabra"] for row in basic] != [entry["text"] for entry in published["entries"]]:
        fail("La taula AFI del vocabulari bàsic no coincideix amb el catàleg.")
    if [row["palabra"] for row in draft] != (BASE / "review/ampliacion-01.txt").read_text(encoding="utf-8").splitlines():
        fail("El llistat alfabètic no coincideix amb la taula de revisió.")
    words = set()
    by_sound = defaultdict(list)
    for row in basic + draft:
        word, ipa = row["palabra"], row["afi_es_ES"]
        if word in words or not re.fullmatch(r"[a-záéíóúüñ]+", word) or not dictionary.lookup(word):
            fail(f"Grafia repetida o fora del lèxic: {word}")
        words.add(word)
        syllables = ipa.split(".")
        if ipa.count("ˈ") != 1 or any(
            not re.fullmatch(r"ˈ?(?:t͡ʃ|[aeioubdfgjklmnɲpɾrsʃtθwʝx])+", s)
            or len(re.findall("[aeiou]", s)) != 1 for s in syllables
        ):
            fail(f"Format AFI incorrecte: {word} {ipa}")
        by_sound[sound_key(ipa)].append(word)
    counts = Counter()
    for row in draft:
        word = row["palabra"]
        tags = row["ids_focus"].split(",")
        expected = [tag for tag, pattern in FOCUSES.items() if re.search(pattern, word)]
        if tags != expected and tags != expected + ["verbos"]:
            fail(f"Focus incompatible amb la grafia: {word}")
        if row["focus"] != " · ".join(labels[tag] for tag in tags):
            fail(f"Etiquetes del focus incompatibles: {word}")
        if row["vocabulario"] not in {"common", "expanded"} or row["ortografia"] not in {"low", "medium", "high"}:
            fail(f"Nivell desconegut: {word}")
        counts.update(tags)
    collisions = [group for group in by_sound.values() if len(group) > 1]
    if collisions:
        fail(f"Homòfons interns segons l’AFI de referència: {collisions}")
    if args.json:
        print(json.dumps({
            "basic": len(basic), "additions": len(draft), "wordCount": len(words),
            "reviewSHA256": hashlib.sha256((BASE / "review/ampliacion-01.tsv").read_bytes()).hexdigest(),
            "basicIpaSHA256": hashlib.sha256((BASE / "review/vocabulario-basico-afi.tsv").read_bytes()).hexdigest(),
            "dictionarySHA256": DICTIONARY_HASHES,
        }))
        return
    print(f"Contrast es_ES: {len(draft)} mots nous i {len(basic)} bàsics. Cobertura AFI completa, sense duplicats interns.")
    print(json.dumps(dict(counts), ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()

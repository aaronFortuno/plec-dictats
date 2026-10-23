"""Optional editorial check. Requires Spylls 0.1.7 and an external Hunspell dictionary.

python tools/validate-spelling.py --dictionary PATH/catalan --catalog catalogs/ca/catalog.json
The dictionary and its licence remain external. This does not check teaching levels or tags.
"""
import argparse
import json
from spylls.hunspell import Dictionary

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dictionary', required=True, help='Path without .aff/.dic extension')
parser.add_argument('--catalog', required=True)
args = parser.parse_args()
dictionary = Dictionary.from_files(args.dictionary)
with open(args.catalog, encoding='utf-8') as source:
    entries = [e for e in json.load(source)['entries'] if e['mode'] == 'words']
unrecognized = [e['text'] for e in entries if not dictionary.lookup(e['text'])]
print(json.dumps({'words': len(entries), 'recognized': len(entries)-len(unrecognized),
                  'unrecognized': unrecognized}, ensure_ascii=True, indent=2))
raise SystemExit(bool(unrecognized))

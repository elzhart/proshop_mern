"""CLI entry: python -m rag_indexer <stage>"""
from __future__ import annotations

import sys

from . import embed, enrich, query, split, upsert

STAGES = {
    "split": split.main,
    "enrich": enrich.main,
    "embed": embed.main,
    "upsert": upsert.main,
    "query": query.main,
}


def usage() -> None:
    print(
        "usage: python -m rag_indexer {split|enrich|embed|upsert|all}\n"
        '       python -m rag_indexer query "<text>" [--k N] [--type T] [--no-hyde] [--json] [--full]',
        file=sys.stderr,
    )


def main() -> None:
    if len(sys.argv) < 2:
        usage()
        sys.exit(2)
    stage = sys.argv[1]
    if stage == "all":
        for name in ("split", "enrich", "embed", "upsert"):
            print(f"\n=== {name} ===")
            STAGES[name]()
        return
    if stage not in STAGES:
        usage()
        sys.exit(2)
    STAGES[stage]()


if __name__ == "__main__":
    main()
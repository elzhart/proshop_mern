"""ProShop feature-flags MCP server (FastMCP)."""
from __future__ import annotations
import json
from datetime import date
from pathlib import Path
from fastmcp import FastMCP

FEATURES_PATH = Path(__file__).resolve().parent.parent / "features.json"
VALID_STATES = ("Disabled", "Testing", "Enabled")

mcp = FastMCP("proshop-feature-flags")


def _load() -> dict:
    return json.loads(FEATURES_PATH.read_text())


def _save(flags: dict) -> None:
    tmp = FEATURES_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(flags, indent=2) + "\n")
    tmp.replace(FEATURES_PATH)


def _today() -> str:
    return date.today().isoformat()


def _dep_states(flags: dict, deps: list[str]) -> list[dict]:
    return [{"feature_id": d, "status": flags.get(d, {}).get("status", "MISSING")} for d in deps]


@mcp.tool()
def list_features() -> list[dict]:
    """List every feature flag in features.json with its lifecycle summary.

    WHEN TO CALL: user asks "what flags exist", "show all features", wants an overview /
    audit, or you need to find a flag whose exact id you do not know. You MUST call this
    instead of grepping features.json directly when the user wants the full set.
    WHEN NOT TO CALL: when the user already named a specific flag — use get_feature_info
    for the full record (description, dependencies, segments).

    Args: none.

    Returns: list of dicts, one per flag, with keys:
        feature_id (str), name (str), status ("Disabled"|"Testing"|"Enabled"),
        traffic_percentage (int 0..100), last_modified (YYYY-MM-DD).
        Sorted alphabetically by feature_id for stable output.

    Example: list_features() -> [
        {"feature_id": "admin_advanced_filters", "name": "...", "status": "Testing",
         "traffic_percentage": 100, "last_modified": "2026-04-15"},
        ...
    ]
    """
    flags = _load()
    return [
        {
            "feature_id": fid,
            "name": f.get("name", ""),
            "status": f.get("status"),
            "traffic_percentage": f.get("traffic_percentage", 0),
            "last_modified": f.get("last_modified", ""),
        }
        for fid, f in sorted(flags.items())
    ]


@mcp.tool()
def get_feature_info(feature_id: str) -> dict:
    """Read full state of one feature flag from proshop_mern features.json.

    WHEN TO CALL: user asks about a flag's status / traffic / dependencies, or before any
    write you MUST call this first to confirm the current state and dependency health.
    WHEN NOT TO CALL: do not call to "list all flags" — this returns a single flag only.

    Args:
        feature_id: snake_case key of the flag (e.g. "search_v2", "dark_mode").

    Returns: dict with keys feature_id, name, status, traffic_percentage, last_modified,
        dependencies (list[str]), dependency_states (list of {feature_id, status}).
        On miss: {"error": "FEATURE_NOT_FOUND", "feature_id": ...}.

    Example: get_feature_info("search_v2") -> {..., "status": "Testing", "traffic_percentage": 15, ...}
    """
    flags = _load()
    f = flags.get(feature_id)
    if not f:
        return {"error": "FEATURE_NOT_FOUND", "feature_id": feature_id}
    return {"feature_id": feature_id, **f, "dependency_states": _dep_states(flags, f.get("dependencies", []))}


@mcp.tool()
def set_feature_state(feature_id: str, state: str) -> dict:
    """Change a flag's status. Adjusts traffic_percentage and last_modified.

    Side effects: Disabled -> traffic 0; Enabled -> traffic 100; Testing -> keep traffic if 1..99
    else default to 10. last_modified is set to today.

    HARD RULE — You MUST NOT promote a flag to "Enabled" if any dependency is in status "Disabled".
    The call returns {"error": "DEPENDENCY_DISABLED", ...} and the file is not written. Enable
    each blocking dependency first, then retry.

    WHEN TO CALL: changing lifecycle (kill switch, promote to GA, roll back). Always call
    get_feature_info first.
    WHEN NOT TO CALL: to change traffic % within Testing — use adjust_traffic_rollout instead.

    Args:
        feature_id: snake_case key.
        state: one of "Disabled" | "Testing" | "Enabled" (case-sensitive).

    Returns: updated feature dict + dependency_states. Errors: FEATURE_NOT_FOUND,
        INVALID_STATE, DEPENDENCY_DISABLED (with blocking_dependencies list).

    Examples:
        set_feature_state("stripe_alternative", "Disabled")  # kill switch
        set_feature_state("search_v2", "Enabled")            # promote to GA
    """
    if state not in VALID_STATES:
        return {"error": "INVALID_STATE", "message": f"state must be one of {VALID_STATES} (case-sensitive)", "feature_id": feature_id}
    flags = _load()
    f = flags.get(feature_id)
    if not f:
        return {"error": "FEATURE_NOT_FOUND", "feature_id": feature_id}
    deps = f.get("dependencies", [])
    if state == "Enabled":
        blocking = [d for d in deps if flags.get(d, {}).get("status") == "Disabled"]
        if blocking:
            return {"error": "DEPENDENCY_DISABLED", "feature_id": feature_id, "blocking_dependencies": blocking,
                    "message": f"Cannot enable '{feature_id}': dependencies still Disabled: {blocking}. Enable them first."}
    f["status"] = state
    if state == "Disabled":
        f["traffic_percentage"] = 0
    elif state == "Enabled":
        f["traffic_percentage"] = 100
    elif not (1 <= f.get("traffic_percentage", 0) <= 99):
        f["traffic_percentage"] = 10
    f["last_modified"] = _today()
    _save(flags)
    return {"feature_id": feature_id, **f, "dependency_states": _dep_states(flags, deps)}


@mcp.tool()
def adjust_traffic_rollout(feature_id: str, percentage: int) -> dict:
    """Set traffic_percentage (0..100) for a flag. Updates last_modified. Does not change status.

    HARD RULE — You MUST NOT call this with percentage > 0 when the flag's status is "Disabled".
    Use set_feature_state to switch the flag to "Testing" or "Enabled" first.

    WHEN TO CALL: ramp a canary (10 -> 25 -> 50), expand an A/B test, or zero a flag in
    preparation for full disable. Always call get_feature_info first.
    WHEN NOT TO CALL: to change status — use set_feature_state.

    Args:
        feature_id: snake_case key.
        percentage: integer 0..100. Non-integers are rejected.

    Returns: updated feature dict. Errors: FEATURE_NOT_FOUND, INVALID_PERCENTAGE, DISABLED_LOCK.

    Examples:
        adjust_traffic_rollout("dark_mode", 50)         # expand A/B
        adjust_traffic_rollout("search_v2", 100)        # last step before promote to Enabled
    """
    if not isinstance(percentage, int) or isinstance(percentage, bool) or not 0 <= percentage <= 100:
        return {"error": "INVALID_PERCENTAGE", "message": "percentage must be an integer in [0, 100]", "feature_id": feature_id}
    flags = _load()
    f = flags.get(feature_id)
    if not f:
        return {"error": "FEATURE_NOT_FOUND", "feature_id": feature_id}
    if f["status"] == "Disabled" and percentage > 0:
        return {"error": "DISABLED_LOCK", "feature_id": feature_id,
                "message": f"'{feature_id}' is Disabled — cannot raise traffic above 0. Call set_feature_state first."}
    f["traffic_percentage"] = percentage
    f["last_modified"] = _today()
    _save(flags)
    return {"feature_id": feature_id, **f}


if __name__ == "__main__":
    mcp.run()
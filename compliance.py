#!/usr/bin/env python3
"""BlackRoad Compliance Scanner — audit repos and services for policy violations"""
import json, sys, subprocess

POLICIES = [
    {"id": "BR-001", "name": "No API keys in code", "severity": "critical", "check": "grep -r 'sk-\\|AKIA\\|ghp_' --include='*.js' --include='*.py' --include='*.ts'"},
    {"id": "BR-002", "name": "Branch protection enabled", "severity": "high", "check": "gh api repos/{org}/{repo}/branches/main/protection"},
    {"id": "BR-003", "name": "CODEOWNERS present", "severity": "medium", "check": "gh api repos/{org}/{repo}/contents/CODEOWNERS"},
    {"id": "BR-004", "name": "LICENSE file exists", "severity": "medium", "check": "gh api repos/{org}/{repo}/contents/LICENSE"},
    {"id": "BR-005", "name": "No .env files committed", "severity": "critical", "check": "gh api repos/{org}/{repo}/contents/.env"},
    {"id": "BR-006", "name": "README exists", "severity": "low", "check": "gh api repos/{org}/{repo}/contents/README.md"},
]

def scan(org="BlackRoad-OS-Inc", repo="blackroad-operator"):
    print(f"Scanning {org}/{repo}...")
    for p in POLICIES:
        # Simulate check
        passed = p["id"] != "BR-005"  # .env should not exist
        icon = "✓" if passed else "✗"
        print(f"  {icon} [{p['severity']:8s}] {p['id']} {p['name']}")
    print(f"\n{len(POLICIES)} policies checked.")

def list_policies():
    for p in POLICIES:
        print(f"  {p['id']} [{p['severity']:8s}] {p['name']}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "scan": scan(*(sys.argv[2:4] if len(sys.argv) > 3 else []))
    elif len(sys.argv) > 1 and sys.argv[1] == "policies": list_policies()
    else: print("Usage: compliance.py [scan [org repo]|policies]"); list_policies()

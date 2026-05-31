# AGENTS.md

This file gives coding-agent instructions for maintaining this repository.

## Project purpose

This repository teaches users how to install and use minikube with Docker Desktop on Windows and macOS.

The audience may include beginners, workshop participants, and engineers preparing for WSO2-on-Kubernetes labs.

## Writing style

Use:

- Clear step-by-step instructions
- Short sections
- Commands in fenced code blocks
- Expected outputs after commands
- Separate Windows and macOS instructions where needed
- Tables for comparison
- Troubleshooting sections with error, meaning, fix, and validation

Avoid:

- Long paragraphs
- Unclear assumptions
- Advanced Kubernetes explanations before basics
- Hidden prerequisites
- Unsupported claims
- Commands that destroy the cluster without a warning

## Technical rules

When adding Kubernetes YAML:

- Use `apiVersion` and `kind` explicitly
- Keep examples small and runnable in minikube
- Prefer the `minikube-demo` namespace for labs
- Include cleanup commands
- Include validation commands
- Avoid private container images
- Use public images from trusted registries where possible

When adding scripts:

- Provide Windows PowerShell and macOS shell equivalents where practical
- Make scripts idempotent where possible
- Print clear progress messages
- Fail safely
- Do not delete clusters unless the script name clearly says reset/delete

## Repository quality checklist

Before marking a task complete:

1. README link is correct
2. Commands were tested or clearly marked untested
3. Expected output is included
4. Cleanup command is included
5. PROGRESS.md is updated
6. Troubleshooting notes are added if any error occurred

## Suggested Codex tasks

Good task prompts:

- "Review this lab and make it beginner friendly."
- "Add expected output after every command."
- "Create a matching macOS version of this Windows script."
- "Check all Kubernetes YAML files for consistency."
- "Add a troubleshooting entry for this error message."
- "Update PROGRESS.md based on the latest terminal output."

Do not let the agent:

- Replace working commands without reason
- Remove verified outputs
- Invent version numbers
- Add paid or cloud-only dependencies
- Add WSO2-specific claims without checking compatibility

---
description: Additional prompts for use with specify.
applyTo: "**/plan.md"
---

* Consider **that nobody reads the logs** when everything is working. Developers or operators only reads the logs to understand a problem. So when a problem impacts a functionality it **must stop immediately and loudly**.
* **Always** use `context7` in order to get the most up-to-date documentation and guidelines for the project. Including OWASP & CWE recommendations, security best practices, and coding standards.
* Because we have a component architecture, **we must not have** any global config that may affect the behavior of other components.
* **Read** any relevant documentation in `docs/implementation_doc/` that explains how the existing system works. 

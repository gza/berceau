# Ideas and Todos

This document collects ideas and todos for future improvements and features.

It is a place to quickly jot down thoughts before they are forgotten. Review and refine them for later implementation.


# update constitution with `fail early and not in silence` principle

Consider *that nobody reads the logs* when everything is working. Developers or operators only reads the logs to understand a problem. So when a problem impacts a functionality it must stop immediately and loudly.

# update constitution with `Keep it simple` principle

Avoid over-engineering and unnecessary complexity. Avoid doing things that are not mandatory to achieve the goal.
Strive for straightforward solutions that are easy to understand, maintain, and extend.


# protect forms with CSRF tokens

Provide an easy way to protect forms against CSRF attacks.

# reduce eslint exclusions

# remove jest maxWorkers override

make new schema per test worker creation "ondemand"

# think about session expiry.

automatically refresh ?
expire after some time of inactivity ?
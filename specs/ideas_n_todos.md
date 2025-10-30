# Ideas and Todos

This document collects ideas and todos for future improvements and features.

It is a place to quickly jot down thoughts before they are forgotten. Review and refine them for later implementation.

# 🧼 reduce eslint exclusions

# 👷 remove jest maxWorkers override

make new schema per test worker creation "ondemand"

# 🚀 Stop initializing test services in `jest.globalSetup.ts`

Instead, initialize them in individual test suites as needed. This can improve test isolation and reduce unnecessary resource usage.

# ⏳️ think about session expiry.

automatically refresh ?
expire after some time of inactivity ?

# 💡 workaround react ignoring onclick in SSR

If we prefix the attribute with x- like x-onclick it may let is pass through the SSR rendering.
In the resulting HTML we can maybe remove the x- prefix.  

# 🔗 Link redirector service

To track outbound link clicks from emails, we could implement a simple redirector service.
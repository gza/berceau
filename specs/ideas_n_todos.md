# Ideas and Todos

This document collects ideas and todos for future improvements and features.

It is a place to quickly jot down thoughts before they are forgotten. Review and refine them for later implementation.

## Bring Prisma to components

As an end-developer, I need to be able to use a database in my components. The schema definitions, database client, and the migrations are stored in the component.

On build :
- The main app collects the Prisma schema from all components if any
- Generates the client
- Initializes the database if needed
- Seeds the database if needed
- Runs the migrations

Credentials & DB info are provided by the main app.

Test framework provides direct database access for integration tests.

Technical notes:
- a cli tool can be provided to run the client generation, the migrations and seed the database globally or on a particular component.
- configuration will provide 2 database connection strings: one for the main app runtime & seeding, and one with admin privileges for running migrations & testing (which requires elevated permissions).

# update constitution with `fail early and not in silence` principle

Consider *that nobody reads the logs* when everything is working. Developers or operators only reads the logs to understand a problem. So when a problem impacts a functionality it must stop immediately and loudly.

# update constitution with `Keep it simple` principle

Avoid over-engineering and unnecessary complexity. Avoid doing things that are not mandatory to achieve the goal.
Strive for straightforward solutions that are easy to understand, maintain, and extend.


# protect forms with CSRF tokens

Provide an easy way to protect forms against CSRF attacks.
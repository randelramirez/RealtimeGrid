1.) User management (ASP.NET Identity or IdentityServer)
2.) Lock entry in the database as well (only the same user can unlock again)
    - ex. bug: user 1 clicks edit on row 1, user 1 refreshes page (the row is locked, unless app is restarted)
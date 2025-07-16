export function authMiddleware(req, res, next) {
    const username = req.cookies.username;
    if (!username) {
        console.log("Unauthorized - no user");
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = { username };
    next();
  }
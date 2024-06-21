import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("req.cookies", req.cookies);
  const token = req.cookies.jwtToken;
  console.log("token", token);
  if (!token)
    return res.json({
      message: "token not found",
    });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.json({
        error: err,
      });

    req.user = user;
    next();
  });
};

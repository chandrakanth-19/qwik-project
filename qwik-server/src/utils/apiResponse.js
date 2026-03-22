// ── Standard API response wrapper ────────────────────────────
const sendResponse = (res, statusCode, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const ok      = (res, data, message = "Success")       => sendResponse(res, 200, true,  message, data);
const created = (res, data, message = "Created")       => sendResponse(res, 201, true,  message, data);
const badReq  = (res, message = "Bad request")         => sendResponse(res, 400, false, message);
const unauth  = (res, message = "Unauthorized")        => sendResponse(res, 401, false, message);
const forbidden=(res, message = "Forbidden")           => sendResponse(res, 403, false, message);
const notFound= (res, message = "Not found")           => sendResponse(res, 404, false, message);
const serverErr=(res, message = "Server error")        => sendResponse(res, 500, false, message);

module.exports = { ok, created, badReq, unauth, forbidden, notFound, serverErr };

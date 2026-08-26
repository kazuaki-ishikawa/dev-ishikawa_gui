const PUSH_PATH_REGEX = /^\/v1/;

module.exports = function (req) {
  // req.headers["X-Auth-Token"] = "83cbba6d115340f5b5edaecd6d93164f";
  // req.headers["X-XaaS-Illusion"] = "KeystoneAdminTokenNormal";
  // if (req.method === "POST" && PUSH_PATH_REGEX.test(req.path)) {
  req.headers["X-Xaas-Illusion"] = "public_gui_keystone_success";
  // }
};

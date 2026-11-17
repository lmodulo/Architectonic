function hasPermission(user, resource, action) {
  return user?.permissions?.[resource]?.[action] === true;
}
export {
  hasPermission as h
};

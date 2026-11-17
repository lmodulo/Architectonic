function hasPermission(user, resource, action) {
  return user?.permissions?.[resource]?.[action] === true;
}

export { hasPermission as h };
//# sourceMappingURL=permissions-DOm5Hx0d.js.map

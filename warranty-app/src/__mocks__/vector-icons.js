const React = require('react');
const { View } = require('react-native');

// Mock icon component
const IconMock = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

module.exports = IconMock;
module.exports.default = IconMock;


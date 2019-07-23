// Expose the standard API
export * from './static-api';

// Expose the plugin author API
export * from './plugin-api';

// Load the stock plugins
import './plugins/base';
import './plugins/promise';
import './plugins/quantifiers';

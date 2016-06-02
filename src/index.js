import {generateStreams} from './stream';
import {generateHoneycomb} from './honeycomb';

const container = document.getElementById('root');
const honeycomb = generateHoneycomb({container});
const streams = generateStreams({container, honeycomb});

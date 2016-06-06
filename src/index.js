import {createHoneycomb, destroyHoneycomb} from './honeycomb';

const Mofun = {createHoneycomb, destroyHoneycomb};

if(window) {
  window.Mofun = Mofun;
}

export default Mofun;

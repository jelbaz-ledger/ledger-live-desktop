// @flow
import "~/live-common-setup";
import "./implement-libcore";

import { throwError } from "rxjs";
import usbDetect from "usb-detection";
import throttle from "lodash/throttle";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { addAccessHook, setErrorRemapping } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { setEnvUnsafe, getEnv } from "@ledgerhq/live-common/lib/env";
import { retry } from "@ledgerhq/live-common/lib/promise";
import TransportNodeHidSingleton from "@ledgerhq/hw-transport-node-hid-singleton";
import BluetoothTransport from "@ledgerhq/hw-transport-node-ble";
import TransportHttp from "@ledgerhq/hw-transport-http";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";

/* eslint-disable guard-for-in */
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}
/* eslint-enable guard-for-in */

let busy = false;

const refreshBusyUIState = throttle(() => {
  if (process.env.CLI) return;
  // $FlowFixMe TODO
  process.send({
    type: "setDeviceBusy",
    busy,
  });
}, 100);

addAccessHook(() => {
  busy = true;
  refreshBusyUIState();
  return () => {
    busy = false;
    refreshBusyUIState();
  };
});

setErrorRemapping(e => {
  // NB ideally we should solve it in ledgerjs
  if (e && e.message && e.message.indexOf("HID") >= 0) {
    return throwError(new DisconnectedDevice(e.message));
  }
  return throwError(e);
});

log("INIT");
if (getEnv("DEVICE_PROXY_URL")) {
  const Tr = TransportHttp(getEnv("DEVICE_PROXY_URL").split("|"));

  registerTransportModule({
    id: "proxy",
    open: () => retry(() => Tr.create(3000, 5000)),
    disconnect: () => Promise.resolve(),
  });
} else {
  registerTransportModule({
    id: "hid",
    open: devicePath => retry(() => TransportNodeHidSingleton.open(), { maxRetry: 4 }),
    disconnect: () => Promise.resolve(),
  });
  registerTransportModule({
    id: "ble",
    open: id => {
      log("ble transport open()");
      return BluetoothTransport.open(id);
    },
    disconnect: id => BluetoothTransport.disconnect(id),
  });
}

export function unsubscribeSetup() {
  TransportNodeHidSingleton.disconnect();
  // TODO to be done on the transport side as part of listen() unsubscribe
  usbDetect.stopMonitoring();
}

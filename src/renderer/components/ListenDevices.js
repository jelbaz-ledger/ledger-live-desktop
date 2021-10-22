// @flow
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import { command } from "~/renderer/commands";

const ListenDevices = () => {
  const dispatch = useDispatch();

  // HID devices
  useEffect(() => {
    let sub;
    function syncDevices() {
      const devices = {};
      sub = command("listenDevices")().subscribe(
        ({ device, deviceModel, type, descriptor }) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: deviceModel ? deviceModel.id : "nanoS",
              wired: true,
            };

            if (type === "add") {
              devices[deviceId] = true;
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              delete devices[deviceId];
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        () => {
          resetDevices();
          syncDevices();
        },
        () => {
          resetDevices();
          syncDevices();
        },
      );
    }

    const timeoutSyncDevices = setTimeout(syncDevices, 1000);

    return () => {
      clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
    };
  }, [dispatch]);

  // Bluetooth devices
  useEffect(() => {
    let sub;
    function syncDevices() {
      const devices = {};
      sub = command("listenBluetoothDevices")().subscribe(
        ({ device, deviceModel, type, descriptor }) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: "nanoX", // hacky :(
              wired: false,
            };

            if (type === "add") {
              devices[deviceId] = true;
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              delete devices[deviceId];
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        error => {
          console.log("Bluetooth error.", error);
        },
        () => {
          console.log("Bluetooth end.");
        },
      );
    }

    syncDevices();

    return () => {
      sub.unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default ListenDevices;

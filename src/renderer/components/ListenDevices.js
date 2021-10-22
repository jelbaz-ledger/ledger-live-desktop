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
    let subBt;

    resetDevices();

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
          syncDevices();
        },
        () => {
          syncDevices();
        },
      );
    }

    function syncBtDevices() {
      const devices = {};
      subBt = command("listenBluetoothDevices")().subscribe(
        ({ type, descriptor }) => {
          const stateDevice = {
            deviceId: descriptor,
            modelId: "nanoX", // hacky :(
            wired: false,
          };

          if (type === "add") {
            devices[descriptor.id] = true;
            dispatch(addDevice(stateDevice));
          } else if (type === "remove") {
            delete devices[descriptor.id];
            dispatch(removeDevice(stateDevice));
          }
        },
        error => {
          console.log("Bluetooth error.", error);
          setTimeout(syncBtDevices, 1000);
        },
        () => {
          console.log("Bluetooth end.");
          setTimeout(syncBtDevices, 1000);
        },
      );
    }

    const timeoutSyncDevices = setTimeout(syncDevices, 1000);
    syncBtDevices();

    return () => {
      clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
      subBt.unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default ListenDevices;

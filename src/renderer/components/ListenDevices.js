// @flow
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import { command } from "~/renderer/commands";

const ListenDevices = () => {
  const dispatch = useDispatch();
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
              modelId: "nanoX", //deviceModel ? deviceModel.id : device.name || "nanoS",
              wired: false, //true,
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
          console.log("bluetooth error", error);
          // resetDevices();
          // syncDevices();
        },
        () => {
          console.log("bluetooth complete");
          // resetDevices();
          // syncDevices();
        },
      );
    }

    syncDevices();

    // const timeoutSyncDevices = setTimeout(syncDevices, 1000);

    return () => {
      // clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default ListenDevices;

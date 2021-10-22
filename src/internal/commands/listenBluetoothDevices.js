// @flow
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport-node-ble";

const cmd = (): Observable<DescriptorEvent<*>> =>
  Observable.create(Transport.listen).pipe(
    map(data => ({
      ...data,
      descriptor: {
        ...data.descriptor,
        _noble: undefined,
      },
    })),
  );

export default cmd;

// @flow
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport-node-hid-singleton";
// import Transport from "@ledgerhq/hw-transport-node-ble";

const cmd = (): Observable<DescriptorEvent<*>> => Observable.create(Transport.listen);

export default cmd;

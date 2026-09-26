// global.d.ts ///
import { Server as SocketIo } from "socket.io";
import { IUser } from "./modules/basic_modules/user/user.interface";

declare global {
  namespace NodeJS {
    interface Global {
      io: SocketIo;
    }
  }
}

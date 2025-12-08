import { BaseResponse } from "./Response";


export class ConfirmAccount {
  code: string;
  constructor(code:string){
    this.code = code;
  }
}

export interface ConfirmAccountResponse extends  ConfirmAccount, BaseResponse{
    message:string
}

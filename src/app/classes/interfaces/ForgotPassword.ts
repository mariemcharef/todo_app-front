import {BaseResponse} from './Response'

export class ForgotPasswordModel {
  email: string;
  constructor(email:string){
    this.email=email
  }
}

export interface ForgotPasswordResponse extends BaseResponse {}

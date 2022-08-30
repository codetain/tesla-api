import { BadRequestException, Injectable } from '@nestjs/common';
import { URL } from 'url';
const sha256 = require('sha256');
import base64url from "base64url";
import { parse } from 'node-html-parser';
import { HiddenInterface } from './interfaces/hiddenInterface';
import { ResponseFromFirstGET } from './interfaces/ResponseFromFirstGET';

@Injectable()
export class AuthService {

    private client_id: string = 'ownerapi';
    private code_challenge_method: string = 'S256';
    private redirect_uri: string = 'https://auth.tesla.com/void/callback';
    private response_type: string = 'code';
    private scope: string = 'openid email offline_access';
    private state: string = '123';

    async login(){
        const responseFromFirstGet :ResponseFromFirstGET | null = await this.firstGETrequest();
        if(!responseFromFirstGet) throw new BadRequestException('HTML page did not GET');
        const hiddenInputs = this.parseHTML(responseFromFirstGet.htmlPage);

        const responseFromSecondPost = await this.secondPOSTrequest(responseFromFirstGet.setCookie, responseFromFirstGet.code_challenge, hiddenInputs);
        
        console.log(responseFromSecondPost);
        
        return responseFromSecondPost;
    }

    async firstGETrequest(): Promise<ResponseFromFirstGET | null>{
        const firstURL = new URL(`https://auth.tesla.com/oauth2/v3/authorize`);

        const code_verifier:string = this.makeCodeVerifier(86);

        const code_challenge = base64url(sha256(code_verifier));        

        firstURL.searchParams.append('client_id', this.client_id);
        firstURL.searchParams.append('code_challenge', code_challenge);
        firstURL.searchParams.append('code_challenge_method', this.code_challenge_method);
        firstURL.searchParams.append('redirect_uri', this.redirect_uri);
        firstURL.searchParams.append('response_type', this.response_type);
        firstURL.searchParams.append('scope', this.scope);
        firstURL.searchParams.append('state', this.state);

        const res = await fetch(firstURL);
        if(res.ok){
            const htmlPage = await res.text();
            const setCookie = res.headers.get('set-cookie');
            
            return {htmlPage, setCookie, code_challenge} as ResponseFromFirstGET;
        }
        return null;
    }

    async secondPOSTrequest(cookie: string, code_challenge: string, payload: HiddenInterface){

        const secondUrl = new URL('https://auth.tesla.com/oauth2/v3/authorize');

        secondUrl.searchParams.append('client_id', this.client_id);
        secondUrl.searchParams.append('code_challenge', code_challenge);
        secondUrl.searchParams.append('code_challenge_method', this.code_challenge_method);
        secondUrl.searchParams.append('redirect_uri', this.redirect_uri);
        secondUrl.searchParams.append('response_type', this.response_type);
        secondUrl.searchParams.append('scope', this.scope);
        secondUrl.searchParams.append('state', this.state);

        let formBody = [];

        //@ts-ignore
        payload.identity='elon@tesla.com';
        //@ts-ignore
        payload.credential='brbgoingtomars';

        for(let property in payload){
            let encodedKey = encodeURIComponent(property);
            //@ts-ignore
            let encodedValue = encodeURIComponent(payload[property]);
            formBody.push(encodedKey + '=' + encodedValue);
        }

        //@ts-ignore
        formBody = formBody.join("&");
        

        const res = await fetch(secondUrl, {
            method: 'POST', 
            headers: {
                'Cookie': cookie, 
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }, 
            //@ts-ignore
            body: formBody
        })

        console.log(res.headers.get('location'));
        return res
        
    }

    // {identity: process.env.IDENTITY, credential: process.env.CREDENTIAL, 'csrf': [value], }

    parseHTML(htmlPage: string): HiddenInterface {
        const root = parse(htmlPage);

        const _csrf = root.querySelector('input[name="_csrf"]')?.attrs.value;
        const _phase = root.querySelector('input[name="_phase"]')?.attrs.value;
        const cancel = root.querySelector('input[name="cancel"]')?.attrs.value;
        const transaction_id = root.querySelector('input[name="transaction_id"]')?.attrs.value;
        
        if(!_csrf || !_phase || !cancel || !transaction_id){
            throw new BadRequestException('Hidden inputs not downloaded');
        }

        return {_csrf, _phase, cancel, transaction_id};
    }

    makeCodeVerifier(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
    }
}

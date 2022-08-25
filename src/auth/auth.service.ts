import { BadRequestException, Injectable } from '@nestjs/common';
import { URL } from 'url';
const crypto = require('crypto');
import { parse } from 'node-html-parser';
import { HiddenInterface } from './interfaces/hiddenInterface';
import { ResponseFromFirstGET } from './interfaces/ResponseFromFirstGET';

@Injectable()
export class AuthService {

    async login(){
        const responseFromFirstGet :ResponseFromFirstGET | null = await this.firstGETrequest();
        if(!responseFromFirstGet) throw new BadRequestException('HTML page did not GET');
        const hiddenInputs = this.parseHTML(responseFromFirstGet.htmlPage);
        
        return responseFromFirstGet.htmlPage;
    }

    async firstGETrequest(): Promise<ResponseFromFirstGET | null>{
        const firstURL = new URL(`https://auth.tesla.com/oauth2/v3/authorize`);

        const code_verifier:string = this.makeCodeVerifier(86);

        const client_id = 'ownerapi';
        const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64');
        const code_challenge_method: string = 'S256';
        const redirect_uri = 'https://auth.tesla.com/void/callback';
        const response_type = 'code';
        const scope = 'openid email offline_access';
        const state = '123';

        firstURL.searchParams.append('client_id', client_id);
        firstURL.searchParams.append('code_challenge', code_challenge);
        firstURL.searchParams.append('code_challenge_method', code_challenge_method);
        firstURL.searchParams.append('redirect_uri', redirect_uri);
        firstURL.searchParams.append('response_type', response_type);
        firstURL.searchParams.append('scope', scope);
        firstURL.searchParams.append('state', state);

        const res = await fetch(firstURL);
        if(res.ok){
            const htmlPage = await res.text();
            const setCookie = await res.headers.get('set-cookie');
            
            return {htmlPage, setCookie} as ResponseFromFirstGET;
        }
        return null;
    }

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

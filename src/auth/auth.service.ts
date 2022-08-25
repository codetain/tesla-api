import { Injectable } from '@nestjs/common';
import { URL } from 'url';
const crypto = require('crypto');

@Injectable()
export class AuthService {

    async login(){
        return this.firstGETrequest();
    }

    async firstGETrequest(): Promise<string | null>{
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
            return htmlPage;
        }
        return null;
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

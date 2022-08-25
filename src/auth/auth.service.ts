import { Injectable } from '@nestjs/common';
import { URL } from 'url';

@Injectable()
export class AuthService {

    async login(){
        // const response = await fetch('http://api.nbp.pl/api/cenyzlota');
        // if(response.ok){
        //     const data = await response.json();
        //     console.log(data);
        // }

        return this.firstGETrequest();
    }

    firstGETrequest(){
        const firstURL = new URL(`https://auth.tesla.com/oauth2/v3/authorize`);

        const code_verifier:string = this.makeCodeVerifier(86);

        const client_id = 'ownerapi';
        const code_challenge = '123';

        firstURL.searchParams.append('client_id', client_id);
        firstURL.searchParams.append('code_challenge', code_challenge);
        firstURL.searchParams.append('code_challenge_method', 'S256');
        firstURL.searchParams.append('redirect_uri', 'https://auth.tesla.com/void/callback');
        firstURL.searchParams.append('response_type', 'code');
        firstURL.searchParams.append('scope', 'openid email offline_access');
        firstURL.searchParams.append('state', '123');

        return firstURL;
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

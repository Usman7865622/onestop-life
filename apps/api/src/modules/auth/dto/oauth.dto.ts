import { IsString, MinLength } from 'class-validator';

/** Google Identity Services ID token, verified server-side against Google's keys. */
export class GoogleAuthDto {
  @IsString()
  @MinLength(10)
  idToken!: string;
}

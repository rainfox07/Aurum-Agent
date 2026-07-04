# WeChat Login Setup

## 1. Create WeChat Open Platform App
Register an app in WeChat Open Platform and obtain AppID and AppSecret.

## 2. Configure Callback URL
Set the OAuth callback URL to:
`https://<your-domain>/api/auth/callback/wechat`

## 3. Set Environment Variables
Add `WECHAT_CLIENT_ID` and `WECHAT_CLIENT_SECRET` to the deployment environment.

## 4. Verify
Open `/sign-in`, select WeChat, complete OAuth, and confirm the user lands in Aurum Agent.

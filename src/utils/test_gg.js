    // // ✅ Test page cho Google OAuth
    // app.get('/test-google', (req, res) => {
    //     res.send(`
    //         <!DOCTYPE html>
    //         <html>
    //         <head>
    //             <title>Test Google OAuth - DaoShop</title>
    //             <style>
    //                 body { 
    //                     font-family: Arial, sans-serif; 
    //                     max-width: 600px; 
    //                     margin: 50px auto; 
    //                     padding: 20px;
    //                     background: #f5f5f5;
    //                 }
    //                 .container {
    //                     background: white;
    //                     padding: 30px;
    //                     border-radius: 10px;
    //                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    //                 }
    //                 .google-btn {
    //                     display: inline-flex;
    //                     align-items: center;
    //                     padding: 12px 24px;
    //                     background: #4285f4;
    //                     color: white;
    //                     text-decoration: none;
    //                     border-radius: 5px;
    //                     font-size: 16px;
    //                     font-weight: 500;
    //                     transition: background 0.3s;
    //                 }
    //                 .google-btn:hover {
    //                     background: #3367d6;
    //                 }
    //                 .google-icon {
    //                     width: 20px;
    //                     height: 20px;
    //                     margin-right: 10px;
    //                     background: white;
    //                     border-radius: 2px;
    //                     padding: 2px;
    //                 }
    //                 .info {
    //                     background: #e8f4f8;
    //                     padding: 15px;
    //                     border-radius: 5px;
    //                     margin: 20px 0;
    //                     border-left: 4px solid #2196f3;
    //                 }
    //                 .endpoint {
    //                     background: #f8f9fa;
    //                     padding: 10px;
    //                     border-radius: 4px;
    //                     font-family: monospace;
    //                     margin: 10px 0;
    //                 }
    //             </style>
    //         </head>
    //         <body>
    //             <div class="container">
    //                 <h1>🔐 Test Google OAuth - DaoShop</h1>
                    
    //                 <div class="info">
    //                     <h3>📋 Test Information:</h3>
    //                     <p><strong>Frontend URL:</strong> ${process.env.FRONTEND_URL}</p>
    //                     <p><strong>Backend URL:</strong> http://localhost:8797</p>
    //                     <p><strong>Google Client ID:</strong> ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...</p>
    //                 </div>

    //                 <h3>🚀 Test Google Login:</h3>
    //                 <a href="/api/auth/google" class="google-btn">
    //                     <svg class="google-icon" viewBox="0 0 24 24">
    //                         <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    //                         <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    //                         <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    //                         <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    //                     </svg>
    //                     Login with Google
    //                 </a>

    //                 <h3>🔗 OAuth Flow:</h3>
    //                 <ol>
    //                     <li>Click "Login with Google" button</li>
    //                     <li>Redirect to Google OAuth</li>
    //                     <li>Login with your Google account</li>
    //                     <li>Google redirects back to: <div class="endpoint">/api/auth/google/callback</div></li>
    //                     <li>Backend creates/updates user</li>
    //                     <li>Redirects to frontend: <div class="endpoint">${process.env.FRONTEND_URL}/auth/success?token=...</div></li>
    //                 </ol>

    //                 <h3>🧪 Direct API Endpoints:</h3>
    //                 <ul>
    //                     <li><strong>Start OAuth:</strong> <div class="endpoint">GET /api/auth/google</div></li>
    //                     <li><strong>OAuth Callback:</strong> <div class="endpoint">GET /api/auth/google/callback</div></li>
    //                     <li><strong>Profile:</strong> <div class="endpoint">GET /api/auth/profile</div></li>
    //                 </ul>

    //                 <div class="info">
    //                     <h4>⚠️ Note:</h4>
    //                     <p>Make sure your Google account is added as a test user in Google Cloud Console if the app is in testing mode.</p>
    //                 </div>
    //             </div>

    //             <script>
    //                 // Check if redirected back with error
    //                 const urlParams = new URLSearchParams(window.location.search);
    //                 const error = urlParams.get('error');
    //                 if (error) {
    //                     alert('OAuth Error: ' + error);
    //                 }
    //             </script>
    //         </body>
    //         </html>
    //     `);
    // });
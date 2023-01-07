# ESU ROCKET LEAGUE OVERLAY & SCOREBOARD + Google Sheets

## Setup 
1. Setup the program the same way you would set it up from the original scoreboard program at: https://github.com/jon-valencia/ESU-RL-Overlay.

2. Once that is setup run the following command in a terminal to install the google sheets python api:  
       
       pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib
       
3. In google_sheets_push.py change variable SPREADSHEET_ID to the id of the spreadsheet you want your statistics to be dumped into and change the variables under pages_to_update to the names of the pages where you want stats to be stored.

4. Run the stats_to_GS.py file, you will be prompted to login and once logged in the program will generate a token.json file. Make sure to move this file into the gs_files folder.

5. When ready to log stats, run the stats_to_GS.py file once again. Make sure to do this before starting the server through the terminal or the program will not begin logging until a game ends.

6. Before logging stats again make sure to delete any files in the game_data folder asside from the placeholder file, i.e. game0.json, game1.json, etc.


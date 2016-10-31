#Setting up the Strippets Project

1.Clone the Strippets Source code.

    > git clone <repo>

2.If execution privileges are not given to the shell script (step 4), then you will need to use the shell command.

    > sh ./strippets.sh --global

3.Build and run the strippets project

    > sh ./strippets.sh --all

4.Verify that the application is working correctly by browsing to http://localhost:8080

5.Dockerize the application by executing the following command:

    > ./strippets.sh -d --all

6.Verify that the application is working correctly by browsing to the url specified by the console window.
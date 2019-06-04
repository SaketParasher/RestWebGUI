
/*------------------------------------------------------------------       ENDPOINT APIS     --------------------------------------------------------------------------*/


------->  /USERS :- 

1) GET -->  /users?phone=7019609525     -->  To GET a user we need to pass phone as queryParam and we also need to pass authentiaction token Named token into headers.
                                             If passed token will be valid ie if it is not expired and if that token is valid for that particular phone then user will be sent otherwise error.


2) POST --> /users                      -->  To POST a user we need to pass firstName, lastName, phone, password and tosAgreement in request body in jSON Format.


3) PUT  --> /users/                     -->  To update a user we need to pass phone and rest fields like firstName , lastName etc in body of request and we also need to pass auth token in request header.
                                             phone will be used as unique key to read the user then token will be authenticated and then user will be updated.


4) DELETE --> /users?phone=7019609525   -->  To DELETE a user we need to pass phone in query param and also the auth token in request header. 


------->  /TOKENS :- 

1) POST  --> /tokens                    -->  To POST a token we need phone and password in request body and then check whether a user exists with that phone or not then match the password passed with 
                                             the password of user which we read from the file. If password matches then we create a token with tokenId and expiration and save it to tokens folder.


2) GET  --> /tokens?id=dmgshy7lb4gy70kzgmtomvkpoglpfxslir38  --> Pass tokenId in queryParam to get a token


3) PUT  --> /tokens                    -->  To updated a token pass the tokenId and extend true in request body the that token will get updated if extend is true and expiration time is updated to 1 hour.


4) DELETE --> /tokens?id=tsszv3v01upthp2mi5pwb49fdxazglq85clr --> Pass tokenID to delete the token in queryParam.



------->   /CHECKS  :-

 
Spectrum 
========
<br>
Spectrum is a CMS written in JavaScript in client-side and server-side.

#How to install spectrum
<br>

<h3>What you need</h3>
<br>

 1. You must have [node.js][1] installed 
 2. You must have [elasticsearch][2] installed
<br>

#How to run spectrum

After you have installed the above requirement, and you will be ready to run spectrum:

 1. Run elasticsearch by fire this command on the command line `elasticsearch -f`
 2. After you have elasticsearch running now you will do `npm install` to install all the dependencies
 3. Now you can run the server by `node server.js`


----------

#API
<br>

`single.html`

In this page you have the following available to be use.

      {{ url }} -- URL of the post
      {{ title }} -- Title of the post
      {{ email }} -- Email address of the author
      {{ author }} -- Author's name
      {{ postedOn }} -- Date posted
      {{ content }} -- Content of the post


<br>

`index.html`

Since this page is a home page which contain 10 blog posts per page.

We are using nunjucks to render the page, and with that we are benefiting with their great features such as for loop.

We are going to loop through `posts` which is an object contain an array of blog posts

    {% for post in posts %}
      {{ post.url }}
      {{ post.title }}
      {{ post.email }}
      {{ post.author }}
      {{ post.postedOn }}
    {% endfor %}
 
`pagination`

For the pagination we have an API that will be use to detect the current page and the next page, and also we are checking if the next page we have post or not.


    <ul>
        {% if hasPrevious == true %}
        <li><a href="/page/{{prevPage}}">Previous</a></li>
        {% endif %}
        {% if hasNext == true %}
        <li><a href="/page/{{nextPage}}">Next</a></li>
        {% endif %}
    </ul>

  [1]: http://nodejs.org
  [2]: http://elasticsearch.org

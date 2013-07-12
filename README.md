##Spectrum

Spectrum is a CMS written in JavaScript on both the client and server sides.

##How To Install Spectrum

###You Will Need
 1. [node.js][1]
 2. [elasticsearch][2]

###How To Run Spectrum

After you have installed the above requirements you will be ready to run spectrum:

 1. Run elasticsearch via command line with the command `elasticsearch -f`.
 2. After you have elasticsearch running use the `npm install` command to install all dependencies.
 3. Run the server via the command line with the command `node server.js`.

##Available Pages

 1. **Homepage** (<http://localhost:3000>)
 2. **Create New Post** (<http://localhost:3000/new/post>)
 3. **Edit Post** (<http://localhost:3000/:id/edit>)

Where **:id** is equal to the url of the page. For example in the following URL **hello-world** would be the ID of the post.

    http://localhost:3000/hello-world/edit

##API

###Single.html

You can use the following variables on this page:

``` javascript
      {{ url }} -- URL of the post.
      {{ title }} -- Title of the post.
      {{ email }} -- Email address of the author.
      {{ author }} -- Author's name.
      {{ postedOn }} -- Date posted.
      {{ content }} -- Content of the post.
```

###Index.html

This is the home page. By default it contains the 10 most recent posts. We are using nunjucks to render the page, and with that we are benefiting with their great features such as the for loop.

In this example we are going to loop through `posts` which is an object containing an array of blog posts

``` javascript
    {% for post in posts %}
      {{ post.url }}
      {{ post.title }}
      {{ post.email }}
      {{ post.author }}
      {{ post.postedOn }}
    {% endfor %}
```

###Pagination.html

For the pagination we have an API that will be used to detect the current page as well as the next page. We also check if whether or not the next page has a post.

``` html
<ul class="pager">
    {% if hasPrevious == true %}
    <li><a href="/page/{{prevPage}}">Previous</a></li>
    {% endif %}
    {% if hasNext == true %}
    <li><a href="/page/{{nextPage}}">Next</a></li>
    {% endif %}
</ul>
```

[1]: http://nodejs.org
[2]: http://elasticsearch.org

# Docker Learning Example
## Abstract
This project demonstrates the use of Docker to create a simple application with
an HTML/JavaScript frontend (running on nginx) and a Python FastAPI backend.

The app developed is of little significance - the containerisation of the app
is of focus here.


## The App Itself
The app consists of a button which, when clicked, will display a shopping list.
The button makes a request to the endpoint `/api/get-list-items` to determine
the set of items to be displayed. The endpoint is served by a Python FastAPI
instance.


## The Containerisation
This project has two "services":
1. The nginx frontend.
2. The FastAPI backend.

Both of these services are separate components in their own right - i.e. while
they do communicate with each other, they can can operate independently as
well. This makes their deployment well-suited for a **Docker Compose stack**. A
Docker Compose stack consists of several **Docker containers**, each running a
dedicated service - these containers can be started individually or (more
commonly) all at once with a single command.

The image specifying how a container for the frontend can be built is located
in the Dockerfile: `src/frontend/Dockerfile`, and the image specifying how a
container for the backend can be built is located in the Dockerfile:
`src/backend/api/Dockerfile`.

The Docker Compose stack describing how the entire project can be built and run
is defined in `docker-compose.yml`.

In this case, we run the following command from the root directory to start
everything up: `docker compose up -d --build --force-recreate` 

- The `-d` flag detaches the process from the console (equivalent to adding `&`
  at the end of a linux command).
- The `--build` flag will rebuild all images associated with the containers.
  This is useful whenever a Dockerfile or build context (e.g. in
  requirements.txt) changes.
- The `--force-recreate` flag will stop all containers (if already running),
  remove them, and then recreate them. This is useful whenever a configuration
  settings specified in `docker-compose.yml` changes.

To spin down the project, we could run `docker compose down` from the root
directory.


## Parts of a Dockerfile
A Dockerfile consists of several instructions (or **directives**) which specify
how an **image** for a container can be built.

Dockerfiles typically build upon another existing image stored in a
**registry** or **repository** (e.g. on [docker hub](https://hub.docker.com)).
These can be public, or private (and indeed, privately hosted images are useful
for custom projects and CI/CD pipelines).

For context, a Dockerfile which begins with the line `FROM nginx:1.27-alpine`
specifies that the service we're making builds on top of the
`nginx:1.27-alpine` image stored on Docker Hub. It turns out that
`nginx:1.27-alpine` builds on top of `nginx:1.27.3-alpine-slim`. This is built
upon a (very) lightweight linux distribution called alpine (specifically the
image `alpine:3.20`), which is itself built upon a "bedrock" image called
`scratch`.

One could extend our project if the image specified in one of our Dockerfiles
were uploaded publicly by writing, e.g., `FROM
docker-learning-example/backend`, in their Dockerfile.

### Dockerfile for the FastAPI Backend
```dockerfile
FROM python:3.13-slim

WORKDIR /app/
COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt

CMD ["fastapi", "run", "api.py"]
```

#### The `FROM` Directive
In the dockerfile above, the very first line specifies the base image to be
used; we're building on top of Python for our backend (specifically Python
version 3.13). Different images for Python exist and can be specified using
**tags** such as "3.13-slim" (see [Image Tags](#image-tags)).

#### The `WORKDIR` Directive
We then specify the **working directory** in the image to be `/app/`, i.e. an
`app` directory in the root of the image's file system. This is usually
arbitrary, but may need to be specifically chosen in some cases (e.g. for
nginx, where static HTML content is served from `/usr/share/nginx/html` by
default).

#### The `COPY` Directive
This command transfers files from our **host machine** into the **image**, and
as such is very important for custom projects. It takes two parameters: `COPY
<src> <dest>`; `src` specifies the source directory/file on our host machine,
and `dest` specifies the destination directory/file in the image. If `dest` is
not an absolute path, it is taken to be **relative to the working directory**
specified by `WORKDIR`.

In this case, we're copying everything from the current directory `.` (relative
to the Dockerfile's location) on our machine into the working directory `.` in
the image.

#### The `RUN` Directive
`RUN` lets us execute a command **inside the image** - whenever a container is
built, this command will be run. A Dockerfile can contain several `RUN`
directives.

Here, we recursively install all dependencies for the backend, as defined in
`requirements.txt`. As before, any paths specified in Dockerfile commands
(unless absolute) are treated as **relative to the working directory**
specified by `WORKDIR`.

#### The `CMD` Directive
Finally, we specify the **entrypoint** (the main command) to be run by
containers built from the image.

This command should **run indefinitely** (in most cases) as the container will
**stop running** once the command terminates.

### Image Tags
Choosing an appropriate tag to base an image off of is often overlooked (e.g.
we could always write `FROM python` rather than consider choosing between `FROM
python:3.13-slim` or `FROM python:3.13-alpine` or any of the many other tags
which are available).

In general, it is best to be as specific as possible when choosing a tag -
images with different tags come with different features. As a rule of thumb,
choose the tag which has the **minimum number of features needed** for the
application being containerised - this reduces bloat in the container and saves
disk space. Some tags also contain a version (e.g. `python:3.13` vs
`python:3.12`) which may also be of significance.

#### Choosing between Python Tags
As an example, the table below lists advantages and disadvantages of some
Python images:

| Image | Operating System | Advantage(s) | Disadvantage(s) |
| ----- | ---------- | --------- | ------------ |
| `python` | Debian (bookworm) | Gives a full Debian-based linux environment | Is very bloated for most applications. Also, no Python version is specified, so incompatibilities in the future may arise |
| `python:3.13` | Debian (bookworm) | Same as above | Same as above, except that the version is specified meaning there is a lower risk of future incompatibility |
| `python:3.13-slim` | Debian (bookworm-slim) | Contains a more streamlined set of features, but is still Debian-based to maximise compatibility | May still contain some bloat (e.g. tools for compiling C extensions which may not be needed) |
| `python:3.13-alpine` | Alpine Linux | Very lightweight (e.g. it doesn't even contain `bash`, but rather the less-often-used `sh` shell) | Relies upon a completely different set of core system utilities to Debian-based images, meaning a much higher risk of incompatibility with some libraries (e.g. `numpy`) |

(In case of curiosity, "bookworm" is the development codename for the latest
version of Debian (version 12) released in 2023).


## The Docker-Compose File
When a project has multiple distinct services, Docker Compose can be used to
simplify the process of launching the containers for each service.

```yaml
name: docker-learning-example

services:
  frontend:
    build:
      context: src/frontend
    container_name: nginx
    ports:
      - 80:80

  fastapi:
    build:
      context: src/backend/api
    container_name: fastapi
```

In the above, we begin by providing a name for the project (to help with
identification). This is optional. We then define the different **services**
our project is composed of, called `frontend` and `fastapi` in this case
(service names are customisable).

Docker Compose needs to know where the Dockerfile for each service is located
(unless in the same directory as the `docker-compose.yml` file itself). To do
this, we provide a **build context** for each service, pointing to the
directory where each respective Dockerfile is located relative to
`docker-compose.yml`.

Again, to aid identification, we give each container a name. In this case,
`nginx` for the frontend container, and `fastapi` for the backend container.
These are optional and customisable.

It is important to remember that Docker containers are, by default, **isolated
environments** - this is to say that they have:
- Their own file system
- Their own network
- Their own (sub)set of system resources

An app running inside a Docker container believes it is running on a completely
separate machine (very much alike virtual machine technologies). However, it is
often the case that a bridge between the **host machine** and the Docker
container needs to be formed. For example:
- To store data persistently (e.g. logs)
- To expose a network port

In this project, we need our frontend to be reachable by the user (and not
locked within the isolated container). To do this, we **expose port 80** from
the nginx container to our host machine (port 80 is the port on which HTTP
runs):

```yaml
ports:
    - 80:80
```

The above **binds port 80 on the host** to **port 80 in the container** (i.e.
port-on-host:port-on-container), and will only work if port 80 on the host is
free. If running a second nginx project on the same server, we might need to
change the port on the host machine:

```yaml
# In a hypothetical second project
ports:
    - 8080:80
```

When running this project, we can access our frontend by navigating to
`http://127.0.0.1/` from a web browser.

### An Interesting Note
When launching Docker containers individually, each container has its own
isolated network. However, since services specified as part of a Docker Compose
stack are often interrelated and need to talk to one another (as is the case in
this project), Docker Compose automatically creates an additional **shared
network** for each of the defined services by default.

This means that, in this project, the following is possible from the frontend:

```bash
curl http://fastapi:8000
```

I.e. we can make a request to another container in the stack **by its service
name**. Indeed, in this case, we configure an **nginx reverse proxy** so that
the FastAPI instance can be accessed from from the same IP as the nginx server
(remembering that Docker containers have their own network IP). This prevents
issues with cross-origin resource sharing (CORS):

```conf
location /api/ {
    proxy_pass "http://fastapi:8000";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The above tells nginx to proxy requests going to the `/api/` path to
`http://fastapi:8000`, meaning that in JavaScript, the following is possible,
and the client **never sees** the true IP address or port at which the API is
running:

```javascript
async function getListItems() {
  return fetchAsync("/api/get-list-items");
}
```

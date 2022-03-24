var tabId = 0;

async function setCurrentUserLogged() {
    try {
        await chrome.scripting.executeScript(
            {
                target: { tabId: tabId, allFrames: true },
                func: getProfileFromLocalStorage
            },
            (item) => {
                user.innerText = item[0].result.object.email;
            }
        );
    } catch (e) {
        console.error(e);
    }
}

async function fillCurrentCourses() {
    try {
        await chrome.scripting.executeScript(
            {
                target: { tabId: tabId, allFrames: true },
                func: getCourses
            },
            (item) => {
                item[0].result.forEach((txt) => {
                    var option = document.createElement("option");
                    option.value = txt;
                    option.text = txt;
                    cursos.appendChild(option);
                });
            }
        );
    } catch (e) {
        console.error(e);
    }
}

function getProfileFromLocalStorage() {
    return JSON.parse(window.localStorage["d-profile"]);
}

function getCourses() {
    var cursos = [];

    Array.from(document.getElementsByClassName("classrooms__item")).forEach((item) => {
        let txt = item.firstChild.getElementsByClassName("card__title")[0].innerText;
        if (txt != null && txt != undefined) {
            cursos.push(txt);
        }
    })
    return cursos;
}

enterCourse.addEventListener("click", async () => {
    try {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId, allFrames: true },
                func: clickAtCourse,
                args: [cursos.value]
            },
            (item) => {
                generatedText.innerHTML = item[0].result;
            }
        )
    } catch (e) {
        console.error(e);
    }
});

async function clickAtCourse(courseName) {
    async function waitPageLoadingFor(time) {
        await new Promise(r => setTimeout(r, time));
    }

    async function generateText(classNumber) {
        var i = 0
        let title = "<h1 class=\"h4\"> Aula " + classNumber + " - " + document.getElementsByClassName("video-menu__header__content")[0].innerText + "</h1>";
        console.clear();
        var toReturn = "<br/><div class=\"card-caption\">" + title + "<br/><br/><h1 class=\"h5\">Exercícios</h1>";

        function log() {
            toReturn += "<br/><br/><div style=\"background-color: white;\">" + document.getElementsByClassName("questions__content")[0].innerHTML + "</div>";

            i++;
        }

        async function changePage() {
            // forLoop thru the 6 question
            for (let index = 0; index < 6; index++) {
                // get the last page and click
                document.getElementsByClassName("pagination")[0].childNodes[index].click();

                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve(log());
                    }, 500);
                });
            }

            return toReturn + "</div>";
        }

        return await changePage();
    }

    function pauseVideo() {
        document.getElementsByClassName("playkit-icon-pause")[0].click();
    }

    try {
        console.log(courseName);
        // get list of available courses, compare with courseName and click
        (Array.from(document.getElementsByClassName("classrooms__item")).filter((item) => {
            return item.firstChild.getElementsByClassName("card__title")[0].innerText == courseName;
        }))[0].firstChild.children[0].click();

        await waitPageLoadingFor(7000);

        // get all classroom available, usually there are 16 classroom
        classroomList = Array.from(document.getElementsByClassName("classroom__list"));

        var text = ""
        for (let index = 0; index < 1; index++) {
            let item = classroomList[index];
            item.firstChild.firstChild.click();

            // wait video-preloading
            await waitPageLoadingFor(3000);

            pauseVideo();

            // wait class page load
            await waitPageLoadingFor(5000);

            // get element at left-side menu, compare and click 
            Array.from(document.getElementsByClassName("video-menu__item__title")).filter((innerItem) => {
                return innerItem.innerText.trim() === "Exercício"
            })[0].click();

            // wait full page loading
            await waitPageLoadingFor(7000);

            // generate text from question and answers
            text += await generateText(index + 1);

            // wait before back page
            await waitPageLoadingFor(2000);

            // go back to the previous page, classroom list
            document.getElementsByClassName("btn-back")[0].click();

            // wait page load fully to continue to the next class
            await waitPageLoadingFor(7000);
        }

        return text
    } catch (e) {
        console.error(e);
    }
}

// Auto exec function
(async function () {
    tabId = (await chrome.storage.local.get(['tabId'])).tabId;

    chrome.runtime.onMessage.addListener((data, origin, sendResponse) => {
        if (data.action == "ClipResponse") {
            console.log(data);
        }
        sendResponse("Received in Popup");
    });

    await setCurrentUserLogged();
    await fillCurrentCourses();
})();

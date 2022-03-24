var currentTab;

async function setCurrentUserLogged() {
    try {
        await chrome.scripting.executeScript(
            {
                target: { tabId: currentTab.id, allFrames: true },
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

function getProfileFromLocalStorage() {
    return JSON.parse(window.localStorage["d-profile"]);
}

async function createPopUp() {
    chrome.storage.local.set({tabId: currentTab.id}, function() {
        chrome.windows.create(
            {
                url: "answer_popup.html",
                type: "popup",
                height: 800,
                width: 1024
            }, function (w) {
                console.log(w);
            }
        );
    });    
}

generateTextButton.addEventListener("click", (e) => {
    createPopUp();
});

(async () => {
    currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    await setCurrentUserLogged();
})();
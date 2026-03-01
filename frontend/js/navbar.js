document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    const page = item.dataset.page
    window.parent.postMessage({ type: "NAV_CLICK", page: page }, "*")

    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("bg-amber-50/20")
    })
    item.classList.add("bg-amber-50/20")
  })
})

window.addEventListener("message", (event) => {
  if (event.data.type === "SET_ACTIVE") {
    const activePage = event.data.page
    document.querySelectorAll(".nav-item").forEach((nav) => {
      if (nav.dataset.page === activePage) {
        nav.classList.add("bg-amber-50/20")
      } else {
        nav.classList.remove("bg-amber-50/20")
      }
    })
  }
})

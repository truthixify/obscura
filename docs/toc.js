// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item "><a href="modules.html">Modules</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura.html"></a></li><li class="chapter-item "><a href="obscura-constants.html">constants</a></li><li class="chapter-item "><a href="obscura-custom_type.html">custom_type</a></li><li class="chapter-item "><a href="obscura-errors.html">errors</a></li><li class="chapter-item "><a href="obscura-events.html">events</a></li><li class="chapter-item "><a href="obscura-interface.html">interface</a></li><li class="chapter-item "><a href="obscura-obscura.html">obscura</a></li><li class="chapter-item "><a href="obscura-structs.html">structs</a></li><li class="chapter-item "><a href="obscura-custom_type-i256.html">i256</a></li><li class="chapter-item "><a href="obscura-custom_type-u1024.html">u1024</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura.html">Obscura</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura-__external.html">__external</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura-__l1_handler.html">__l1_handler</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura-__constructor.html">__constructor</a></li></ol></li><li class="chapter-item "><a href="constants.html">Constants</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura-constants-FIELD_SIZE.html">FIELD_SIZE</a></li><li class="chapter-item "><a href="obscura-constants-MAX_EXT_AMOUNT.html">MAX_EXT_AMOUNT</a></li><li class="chapter-item "><a href="obscura-constants-MAX_FEE.html">MAX_FEE</a></li><li class="chapter-item "><a href="obscura-constants-MIN_EXT_AMOUNT.html">MIN_EXT_AMOUNT</a></li><li class="chapter-item "><a href="obscura-constants-VERIFIER_CLASSHASH.html">VERIFIER_CLASSHASH</a></li><li class="chapter-item "><a href="obscura-constants-ROOT_HISTORY_SIZE.html">ROOT_HISTORY_SIZE</a></li><li class="chapter-item "><a href="obscura-constants-FELT_STRK_CONTRACT.html">FELT_STRK_CONTRACT</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_ONLY_OWNER_CAN_BE_REGISTERED.html">ERROR_ONLY_OWNER_CAN_BE_REGISTERED</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_MERKLE_ROOT.html">ERROR_INVALID_MERKLE_ROOT</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INPUT_ALREADY_SPENT.html">ERROR_INPUT_ALREADY_SPENT</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_ZERO_ADDRESS.html">ERROR_ZERO_ADDRESS</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_FEE.html">ERROR_INVALID_FEE</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_EXT_AMOUNT.html">ERROR_INVALID_EXT_AMOUNT</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_TREE_DEPTH.html">ERROR_INVALID_TREE_DEPTH</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_MERKLE_TREE_IS_FULL.html">ERROR_MERKLE_TREE_IS_FULL</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INCORRECT_EXT_HASH.html">ERROR_INCORRECT_EXT_HASH</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_PUBLIC_AMOUNT.html">ERROR_INVALID_PUBLIC_AMOUNT</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_INVALID_TRANSACTION_PROOF.html">ERROR_INVALID_TRANSACTION_PROOF</a></li><li class="chapter-item "><a href="obscura-errors-ERROR_AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT.html">ERROR_AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT</a></li></ol></li><li class="chapter-item "><a href="free_functions.html">Free functions</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura-obscura-Obscura-constructor.html">constructor</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura-unsafe_new_contract_state.html">unsafe_new_contract_state</a></li></ol></li><li class="chapter-item "><a href="structs.html">Structs</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura-custom_type-i256-I256.html">I256</a></li><li class="chapter-item "><a href="obscura-custom_type-u1024-U1024.html">U1024</a></li><li class="chapter-item "><a href="obscura-events-NewCommitment.html">NewCommitment</a></li><li class="chapter-item "><a href="obscura-events-NewNullifier.html">NewNullifier</a></li><li class="chapter-item "><a href="obscura-events-PublicKey.html">PublicKey</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraDispatcher.html">IObscuraDispatcher</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraLibraryDispatcher.html">IObscuraLibraryDispatcher</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraSafeLibraryDispatcher.html">IObscuraSafeLibraryDispatcher</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraSafeDispatcher.html">IObscuraSafeDispatcher</a></li><li class="chapter-item "><a href="obscura-obscura-Obscura-ContractState.html">ContractState</a></li><li class="chapter-item "><a href="obscura-structs-MerkleTreeWithHistory.html">MerkleTreeWithHistory</a></li><li class="chapter-item "><a href="obscura-structs-ExtData.html">ExtData</a></li><li class="chapter-item "><a href="obscura-structs-Proof.html">Proof</a></li><li class="chapter-item "><a href="obscura-structs-Account.html">Account</a></li></ol></li><li class="chapter-item "><a href="enums.html">Enums</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura-obscura-Obscura-Event.html">Event</a></li></ol></li><li class="chapter-item "><a href="traits.html">Traits</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="obscura-custom_type-i256-I256Trait.html">I256Trait</a></li><li class="chapter-item "><a href="obscura-interface-IObscura.html">IObscura</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraDispatcherTrait.html">IObscuraDispatcherTrait</a></li><li class="chapter-item "><a href="obscura-interface-IObscuraSafeDispatcherTrait.html">IObscuraSafeDispatcherTrait</a></li></ol></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
